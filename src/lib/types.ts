import { AnnotatedPrediction } from "@tensorflow-models/handpose";

export type Gesture = Array<[number, number, number]>;

export type TrainGesture = {
  label: string;
  id: number;
  gestures: Array<Gesture>;
};
export type TrainGestures = Array<TrainGesture>;

export type AnnotatedPredictionNormalized = AnnotatedPrediction & {
  /**
   * Normalized against the min and max
   */
  landmarksNormalized: Gesture;
};
