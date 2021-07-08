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

export const writeData = (gestures) => {
  const trainContent = [makeHeader()];
  const testContent = [makeHeader()];
  /**
   * Here we parse the gesture data so that we can store it in CSV
   * There are better ways of doing this
   */
  gestures.forEach((gestureWrapper, gestureIndex) => {
    gestureWrapper.gestures.forEach((gesture, index) => {
      const row = gesture.map((lm) => [lm[0], lm[1]]).flat();
      // pushing the index which serves as our 'coded' gesture label
      row.push(gestureIndex);

      // distribute into test and training set
      if (index % 9 === 1) {
        testContent.push(row);
      } else {
        trainContent.push(row);
      }
    });
  });

  /**
   * Write the to a file so that we can experiment a bit with training the model
   * You could also directly start the training from here of course
   */
  try {
    fs.writeFileSync("./data/train.csv", trainContent.join("\n"), {
      flag: "w",
    });
    fs.writeFileSync("./data/test.csv", testContent.join("\n"), { flag: "w" });
  } catch (e) {
    console.error("Bleh, something wrong while writing training data");
  }
};
