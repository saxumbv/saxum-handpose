import { AnnotatedPrediction } from "@tensorflow-models/handpose";
import { AnnotatedPredictionNormalized } from "../types";

export const makeBoundingBox = (
  handPredictions: AnnotatedPrediction[]
): AnnotatedPrediction[] => {
  return handPredictions.map((prediction) => {
    return {
      ...prediction,
      boundingBox: {
        topLeft: [
          Math.min(...prediction.landmarks.map((lm) => lm[1])),
          Math.min(...prediction.landmarks.map((lm) => lm[0])),
        ],
        bottomRight: [
          Math.max(...prediction.landmarks.map((lm) => lm[1])),
          Math.max(...prediction.landmarks.map((lm) => lm[0])),
        ],
      },
    };
  });
};

/**
 * Normalises all hand landmarks to their own bounding box.
 * A joint in the middle of the hand will yield XY 0.5 0.5
 */
export const normalise = (
  handPredictions: AnnotatedPrediction[]
): AnnotatedPredictionNormalized[] => {
  return handPredictions.map((prediction) => {
    const [top, left] = prediction.boundingBox.topLeft;
    const [bottom, right] = prediction.boundingBox.bottomRight;

    const width = right - left;
    const height = bottom - top;

    return {
      ...prediction,
      landmarksNormalized: prediction.landmarks.map((lm) => {
        return [
          // normalizing x values
          (lm[0] - left) / width,
          // and y values
          (lm[1] - top) / height,
          // ignoring z values (what would we normalise against?)
          0,
        ];
      }),
    };
  });
};
