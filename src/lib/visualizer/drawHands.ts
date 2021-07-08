// Drawing function
import { AnnotatedPrediction } from "@tensorflow-models/handpose";
import { fingerJoints, style } from "./keypointsMap";

export const drawHands = (
  predictions: AnnotatedPrediction[],
  ctx: CanvasRenderingContext2D
) => {
  // Check if we have predictions
  if (predictions.length > 0) {
    // Loop through each prediction
    predictions.forEach((prediction) => {
      // Determine scale factor
      // const scale = canvasSize / sourceSize

      // draw bounding box
      const [top, left] = prediction.boundingBox.topLeft; //.map(v => v * scale);
      const [bottom, right] = prediction.boundingBox.bottomRight; //.map(v => v * scale);

      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.stroke();

      // Grab landmarks and scale
      const landmarks = prediction.landmarks; //.map(lm => [lm[0] * scale, lm[1]* scale]);

      // Loop through fingers
      for (let j = 0; j < Object.keys(fingerJoints).length; j++) {
        let finger = Object.keys(fingerJoints)[j];
        //  Loop through pairs of joints
        // @ts-ignore
        for (let k = 0; k < fingerJoints[finger].length - 1; k++) {
          // Get pairs of joints
          // @ts-ignore
          const firstJointIndex = fingerJoints[finger][k];
          // @ts-ignore
          const secondJointIndex = fingerJoints[finger][k + 1];

          // Draw path
          ctx.beginPath();
          ctx.moveTo(
            landmarks[firstJointIndex][0],
            landmarks[firstJointIndex][1]
          );
          ctx.lineTo(
            landmarks[secondJointIndex][0],
            landmarks[secondJointIndex][1]
          );
          ctx.strokeStyle = "plum";
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      }

      // Loop through landmarks and draw em
      for (let i = 0; i < landmarks.length; i++) {
        // Get x point
        const x = landmarks[i][0];
        // Get y point
        const y = landmarks[i][1];
        // Start drawing
        ctx.beginPath();
        // @ts-ignore
        ctx.arc(x, y, style[i]["size"], 0, 3 * Math.PI);

        // Set line color
        // @ts-ignore
        ctx.fillStyle = style[i]["color"];
        ctx.fill();
      }
    });
  }
};
