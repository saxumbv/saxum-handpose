import React from "react";
import { AnnotatedPredictionNormalized } from "./types";

type HandPoseContextType = {
  hands: Array<AnnotatedPredictionNormalized>;
};

const HandPoseContext = React.createContext<HandPoseContextType>({ hands: [] });

export default HandPoseContext;
