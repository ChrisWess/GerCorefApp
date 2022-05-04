import re
import operator
import collections
import logging

logger = logging.getLogger(__name__)

BEGIN_DOCUMENT_REGEX = re.compile(r"#begin document (.*)(?:\.|_)(\d+_?\d*)")  # First line at each document
COREF_RESULTS_REGEX = re.compile(r".*Coreference: Recall: \([0-9.]+ / [0-9.]+\) ([0-9.]+)%\tPrecision: \([0-9.]+ / [0-9.]+\) ([0-9.]+)%\tF1: ([0-9.]+)%.*", re.DOTALL)
REMOVE_MENTION_MARKUP = re.compile(r"\(?(\d+)\)?")


def output_conll(input_file, output_file, predictions, subtoken_map, merge_overlapping_spans):
    prediction_map = {}
    for doc_key, clusters in predictions.items():
        start_map = collections.defaultdict(list)
        end_map = collections.defaultdict(list)
        word_map = collections.defaultdict(list)
        for cluster_id, mentions in enumerate(clusters):
            for start, end in mentions:
                start, end = subtoken_map[doc_key][start], subtoken_map[doc_key][end]
                if start == end:
                    word_map[start].append(cluster_id)
                else:
                    start_map[start].append((cluster_id, end))
                    end_map[end].append((cluster_id, start))
        for k, v in start_map.items():
            start_map[k] = [cluster_id for cluster_id, end in sorted(v, key=operator.itemgetter(1), reverse=True)]
        for k, v in end_map.items():
            end_map[k] = [cluster_id for cluster_id, start in sorted(v, key=operator.itemgetter(1), reverse=True)]
        prediction_map[doc_key] = (start_map, end_map, word_map)

    word_index = 0
    active_count = collections.Counter()
    for line in input_file.readlines():
        row = line.split()
        if len(row) == 0:
            output_file.write("\n")
        elif row[0].startswith("#"):
            begin_match = re.match(BEGIN_DOCUMENT_REGEX, line)
            if begin_match:
                # Reset at the start of each document
                active_count = collections.Counter()
                doc_key = f'{begin_match.group(1)}_{begin_match.group(2)}'
                start_map, end_map, word_map = prediction_map[doc_key]
                word_index = 0
            output_file.write(line)
            output_file.write("\n")
        else:
            # assert get_doc_key(row[0], row[1]) == doc_key
            # assert "_".join(row[0].split(".")) == doc_key
            row[3] = REMOVE_MENTION_MARKUP.sub(r"\1", row[3])
            row[6] = REMOVE_MENTION_MARKUP.sub(r"\1", row[6])
            coref_list = []
            if word_index in end_map:
                for cluster_id in end_map[word_index]:
                    active_count[cluster_id] -= 1
                    if active_count[cluster_id] == 0 or not merge_overlapping_spans:
                        coref_list.append("{})".format(cluster_id))
            if word_index in word_map:
                if merge_overlapping_spans:
                    for cluster_id in set(word_map[word_index]) - set(start_map[word_index]) - set(end_map[word_index]):
                        if active_count[cluster_id] == 0:
                            coref_list.append("({})".format(cluster_id))
                else:
                    for cluster_id in set(word_map[word_index]):
                        coref_list.append("({})".format(cluster_id))
            if word_index in start_map:
                for cluster_id in start_map[word_index]:
                    active_count[cluster_id] += 1
                    if active_count[cluster_id] == 1 or not merge_overlapping_spans:
                        coref_list.append("({}".format(cluster_id))

            if len(coref_list) == 0:
                row[-1] = "-"
            else:
                row[-1] = "|".join(coref_list)

            output_file.write("   ".join(row))
            output_file.write("\n")
            word_index += 1
