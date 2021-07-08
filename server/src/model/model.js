import tf from "@tensorflow/tfjs";
import fs from "fs";

export const TRAIN_DATA_PATH = "./data/train.csv";
export const TEST_DATA_PATH = "./data/test.csv";

/**
 * Reading all training data into memory,
 * Normally thats bad practice, since dataset can be larger than working memory
 */
const TRAINING_DATA = fs.readFileSync(TRAIN_DATA_PATH, "utf-8").split("\n");
const TEST_DATA = fs.readFileSync(TRAIN_DATA_PATH, "utf-8").split("\n");

export const NUM_GESTURE_CLASSES = 4;

// minus one because of the header
export const TRAINING_DATA_LENGTH = TRAINING_DATA.length - 1;
export const TEST_DATA_LENGTH = TEST_DATA.length - 1;

// Converts a row from the CSV into features and labels.
// Each feature field is normalized within training data constants:

const csvTransform = ({ xs, ys }) => {
  // Convert xs(features) and ys(labels) from object form (keyed by
  // column name) to array form.
  return { xs: Object.values(xs), ys: Object.values(ys) };
};

const CSV_TRAIN_DATA_PATH = "file://" + process.cwd() + "/data/train.csv";
const CSV_TEST_DATA_PATH = "file://" + process.cwd() + "/data/test.csv";

export const trainingData = tf.data
  .csv(CSV_TRAIN_DATA_PATH, {
    columnConfigs: {
      label: {
        isLabel: true,
      },
    },
  })
  .map(csvTransform)
  .shuffle(100)
  .batch(100);

console.log(trainingData.toArray());

// Load all training data in one batch to use for eval:
export const trainingValidationData = tf.data
  .csv(CSV_TEST_DATA_PATH, { columnConfigs: { label: { isLabel: true } } })
  .map(csvTransform)
  .batch(TRAINING_DATA_LENGTH);

// Load all test data in one batch to use for eval:
export const testValidationData = tf.data
  .csv(CSV_TEST_DATA_PATH, { columnConfigs: { label: { isLabel: true } } })
  .map(csvTransform)
  .batch(TEST_DATA_LENGTH);

export const model = tf.sequential();
model.add(
  tf.layers.dense({ units: 250, activation: "relu", inputShape: [42] })
);
model.add(tf.layers.dense({ units: 175, activation: "relu" }));
model.add(tf.layers.dense({ units: 150, activation: "relu" }));
model.add(
  tf.layers.dense({ units: NUM_GESTURE_CLASSES, activation: "softmax" })
);
model.compile({
  optimizer: tf.train.adam(),
  loss: "sparseCategoricalCrossentropy",
  metrics: ["accuracy"],
});

// Returns pitch class evaluation percentages for training data with an option
// to include test data.
export async function evaluate(useTestData) {
  // TODO(kreeger): Consider using model.evaluateDataset()
  let results = {};
  await trainingValidationData.forEachAsync((pitchTypeBatch) => {
    const values = model.predict(pitchTypeBatch.xs).dataSync();
    const classSize = TRAINING_DATA_LENGTH / NUM_PITCH_CLASSES;
    for (let i = 0; i < NUM_PITCH_CLASSES; i++) {
      results[pitchFromClassNum(i)] = {
        training: calcPitchClassEval(i, classSize, values),
      };
    }
  });

  if (useTestData) {
    await testValidationData.forEachAsync((pitchTypeBatch) => {
      const values = model.predict(pitchTypeBatch.xs).dataSync();
      const classSize = TEST_DATA_LENGTH / NUM_PITCH_CLASSES;
      for (let i = 0; i < NUM_PITCH_CLASSES; i++) {
        results[pitchFromClassNum(i)].validation = calcPitchClassEval(
          i,
          classSize,
          values
        );
      }
    });
  }
  return results;
}

export async function predictSample(sample) {
  console.log("calling predictSample on ", sample);
  let result = model.predict(tf.tensor(sample, [1, sample.length])).arraySync();
  console.log(result);
  var maxValue = 0;
  var predictedPitch = 7;
  for (var i = 0; i < NUM_PITCH_CLASSES; i++) {
    if (result[0][i] > maxValue) {
      predictedPitch = i;
    }
  }
  return pitchFromClassNum(predictedPitch);
}

// Determines accuracy evaluation for a given pitch class by index:
export function calcPitchClassEval(pitchIndex, classSize, values) {
  // Output has 7 different class values for each pitch, offset based on
  // which pitch class (ordered by i):
  let index = pitchIndex * classSize * NUM_PITCH_CLASSES + pitchIndex;
  let total = 0;
  for (let i = 0; i < classSize; i++) {
    total += values[index];
    index += NUM_PITCH_CLASSES;
  }
  return total / classSize;
}

// Returns the string value for Baseball pitch labels
export function pitchFromClassNum(classNum) {
  switch (classNum) {
    case 0:
      return "Fastball (2-seam)";
    case 1:
      return "Fastball (4-seam)";
    case 2:
      return "Fastball (sinker)";
    case 3:
      return "Fastball (cutter)";
    case 4:
      return "Slider";
    case 5:
      return "Changeup";
    case 6:
      return "Curveball";
    default:
      return "Unknown";
  }
}
