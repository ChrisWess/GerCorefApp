import * as React from 'react';
import { createTheme } from '@mui/material/styles';
import {Button} from "@mui/material";
import Plot from 'react-plotly.js';
import {Mention} from "./MainView";
import axios from "axios";
import {MutableRefObject} from "react";
import {ConfidenceValues} from "./MainPage";


const theme = createTheme();

interface StatisticsProps {
    currentMention?: Mention | undefined
    confidences: (ConfidenceValues | null)[][]
    allCorefs: MutableRefObject<Mention[][]>
}

const Statistics: React.FC<StatisticsProps> = ({ currentMention, confidences, allCorefs }) => {

    function CustomPlot() {
        if (currentMention && currentMention.autoCreated) {
            let probs: ConfidenceValues = confidences[currentMention.clusterIdx][currentMention.mentionIdx]!
            let x: number[] = [probs.noClusterProb, probs.newClusterProb]
            let y: string[] = ['No Mention ', 'New Cluster ']
            for (let i = 0; i < probs.clusterProbs.length; i++) {
                x.push(probs.clusterProbs[i])
                y.push('Cluster ' + (i + 1) + ' ')
            }

            return <Plot data={[
                        {
                            x: x,
                            y: y,
                            type: 'bar',
                            marker: {color: 'blue'},
                            orientation: 'h'
                        }
                    ]}
                    layout={ {width: 300, height: 540, title: "Model's Coreference Confidence"} }
                />
        } else {
            return <></>
        }
    }

    return (
        <>
            <CustomPlot/>
            <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                Open Graph Dashboard
            </Button>
        </>
    );
}

export default Statistics;
