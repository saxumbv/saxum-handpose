import fs from "fs";

// the amount of landmark in handpose
const LANDMARK_COUNT = 21;

const makeHeader = () => {
  const header = [];
  let idx = 0;

  while (idx < LANDMARK_COUNT) {
    idx++;

    header.push(`lm${idx}_x`);
    header.push(`lm${idx}_y`);
  }

  // also create the gesture labe
  header.push("label");

  return header;
};

/**
 * Recorded gestures, see types in client for exact structure
 */
export const writeData = (recordedGestures, trainDataPath, testDataPath) => {
  const trainContent = [makeHeader()];
  const testContent = [makeHeader()];

  recordedGestures.forEach((gestureWrapper) => {
    gestureWrapper.gestures.forEach((gesture, index) => {
      /**
       * Our gestures are arrays of 3D positions
       * We store them flat in the cvs (for each x and each y value there is one column)
       * TODO: we should look into storing data as json and train the model on 2D data (or perhaps 3D?)
       */
      const row = gesture.map((lm) => [lm[0], lm[1]]).flat();

      // pushing the index which serves as our 'coded' gesture label
      row.push(gestureWrapper.id);

      // distribute into test and training set, 10% vs 90%
      if (index % 9 === 1) {
        testContent.push(row);
      } else {
        trainContent.push(row);
      }
    });
  });

  /**
   * Write the to a file so that we can experiment a bit with training the model,
   * without having to start the client
   */
  try {
    fs.writeFileSync(trainDataPath, trainContent.join("\n"), {
      flag: "w",
    });
    fs.writeFileSync(testDataPath, testContent.join("\n"), {
      flag: "w",
    });
  } catch (e) {
    console.error("Bleh, something wrong while writing training data");
  }
};
