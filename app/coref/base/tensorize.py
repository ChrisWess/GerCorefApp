from app.coref.base import util
import numpy as np
import random
from transformers import AutoTokenizer
import logging

logger = logging.getLogger(__name__)


class Tensorizer:
    def __init__(self, config):
        self.config = config
        self.long_doc_strategy = config['long_doc_strategy']
        self.tokenizer = AutoTokenizer.from_pretrained(config['bert_tokenizer_name'])

        # Will be used in evaluation
        self.stored_info = {}
        self.stored_info['tokens'] = {}  # {doc_key: ...}
        self.stored_info['subtoken_maps'] = {}  # {doc_key: ...}; mapping back to tokens
        self.stored_info['gold'] = {}  # {doc_key: ...}
        self.stored_info['genre_dict'] = {genre: idx for idx, genre in enumerate(config['genres'])}

    @staticmethod
    def _tensorize_spans(spans):
        if len(spans) > 0:
            starts, ends = zip(*spans)
        else:
            starts, ends = [], []
        return np.array(starts), np.array(ends)

    @staticmethod
    def _tensorize_span_w_labels(spans, label_dict):
        if len(spans) > 0:
            starts, ends, labels = zip(*spans)
        else:
            starts, ends, labels = [], [], []
        return np.array(starts), np.array(ends), np.array([label_dict[label] for label in labels])

    def _get_speaker_dict(self, speakers):
        speaker_dict = {'UNK': 0, '[SPL]': 1}
        for speaker in speakers:
            if len(speaker_dict) > self.config['max_num_speakers']:
                pass  # 'break' to limit # speakers
            if speaker not in speaker_dict:
                speaker_dict[speaker] = len(speaker_dict)
        return speaker_dict

    def tensorize_example(self, example, is_training):
        # Mentions and clusters
        clusters = example['clusters']
        gold_mentions = sorted(tuple(mention) for mention in util.flatten(clusters))
        gold_mention_map = {mention: idx for idx, mention in enumerate(gold_mentions)}
        gold_mention_cluster_map = np.zeros(len(gold_mentions))  # 0: no cluster
        for cluster_id, cluster in enumerate(clusters):
            for mention in cluster:
                gold_mention_cluster_map[gold_mention_map[tuple(mention)]] = cluster_id + 1

        # Speakers
        speakers = example['speakers']
        speaker_dict = self._get_speaker_dict(util.flatten(speakers))

        # Sentences/segments
        sentences = example['sentences']  # Segments
        sentence_map = example['sentence_map']
        num_words = sum([len(s) for s in sentences])
        max_sentence_len = self.config['max_segment_len']
        sentence_len = np.array([len(s) for s in sentences])

        # Bert input
        input_ids, input_mask, speaker_ids = [], [], []
        for idx, (sent_tokens, sent_speakers) in enumerate(zip(sentences, speakers)):
            sent_input_ids = self.tokenizer.convert_tokens_to_ids(sent_tokens)
            sent_input_mask = [1] * len(sent_input_ids)
            sent_speaker_ids = [speaker_dict[speaker] for speaker in sent_speakers]
            while len(sent_input_ids) < max_sentence_len:
                sent_input_ids.append(0)
                sent_input_mask.append(0)
                sent_speaker_ids.append(0)
            input_ids.append(sent_input_ids)
            input_mask.append(sent_input_mask)
            speaker_ids.append(sent_speaker_ids)
        input_ids = np.array(input_ids)
        input_mask = np.array(input_mask)
        speaker_ids = np.array(speaker_ids)
        assert num_words == np.sum(input_mask), (num_words, np.sum(input_mask))

        # Keep info to store
        doc_key = example['doc_key']
        self.stored_info['subtoken_maps'][doc_key] = example.get('subtoken_map', None)
        self.stored_info['gold'][doc_key] = example['clusters']
        # self.stored_info['tokens'][doc_key] = example['tokens']

        # Construct example
        genre = self.stored_info['genre_dict'].get(doc_key[:2], 0)
        gold_starts, gold_ends = self._tensorize_spans(gold_mentions)
        example_tensor = (input_ids, input_mask, speaker_ids, sentence_len, genre, sentence_map, is_training,
                          gold_starts, gold_ends, gold_mention_cluster_map)

        if is_training and len(sentences) > self.config['max_training_sentences']:
            if self.long_doc_strategy == 'split':
                out = []
                for sentence_offset in range(0, len(sentences), self.config['max_training_sentences']):
                    out.append((
                        f'{doc_key}_{sentence_offset}',
                        self.truncate_example(*example_tensor, sentence_offset=sentence_offset)
                    ))
                return out
            elif self.long_doc_strategy == 'truncate':
                return [(doc_key, self.truncate_example(*example_tensor))]
            elif self.long_doc_strategy == 'even-chunks':
                out = []
                max_len = self.config["max_training_sentences"]
                n = len(sentences)
                buckets = min(n, (len(sentences) + max_len - 1) // max_len)
                floor = n // buckets 
                ceiling = floor + 1
                stepdown = n % buckets
                offset = 0
                for _ in range(stepdown):
                    out.append((
                        f'{doc_key}_{offset}',
                        self.truncate_example(*example_tensor, max_sentences=ceiling, sentence_offset=offset)
                    ))
                    offset += ceiling
                for _ in range(stepdown, buckets):
                    out.append((
                        f'{doc_key}_{offset}',
                        self.truncate_example(*example_tensor, max_sentences=floor, sentence_offset=offset)
                    ))
                    offset += floor
                return out
            else:
                return [(doc_key, example_tensor)]
        else:
            return [(doc_key, example_tensor)]

    def truncate_example(self, input_ids, input_mask, speaker_ids, sentence_len, genre, sentence_map, is_training,
                         gold_starts, gold_ends, gold_mention_cluster_map, max_sentences=None, sentence_offset=None):

        max_sentences = self.config["max_training_sentences"] if max_sentences is None else max_sentences
        num_sentences = input_ids.shape[0]
        assert num_sentences >= max_sentences

        sent_offset = sentence_offset
        if sent_offset is None:
            sent_offset = random.randint(0, num_sentences - max_sentences)
        word_offset = sentence_len[:sent_offset].sum()
        num_words = sentence_len[sent_offset: sent_offset + max_sentences].sum()

        input_ids = input_ids[sent_offset: sent_offset + max_sentences, :]
        input_mask = input_mask[sent_offset: sent_offset + max_sentences, :]
        speaker_ids = speaker_ids[sent_offset: sent_offset + max_sentences, :]
        sentence_len = sentence_len[sent_offset: sent_offset + max_sentences]

        sentence_map = sentence_map[word_offset: word_offset + num_words]
        gold_spans = (gold_starts < word_offset + num_words) & (gold_ends >= word_offset)
        gold_starts = gold_starts[gold_spans] - word_offset
        gold_ends = gold_ends[gold_spans] - word_offset
        gold_mention_cluster_map = gold_mention_cluster_map[gold_spans]

        return input_ids, input_mask, speaker_ids, sentence_len, genre, sentence_map, \
               is_training, gold_starts, gold_ends, gold_mention_cluster_map
