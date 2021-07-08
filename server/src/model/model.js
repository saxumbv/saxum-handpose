import tf from "@tensorflow/tfjs-node";
import fs from "fs";

// Converts a row from the CSV into features and labels.
// Each feature field is normalized within training data constants:
const csvTransform = ({ xs, ys }) => {
  // Convert xs(features) and ys(labels) from object form (keyed by
  // column name) to array form.
  return { xs: Object.values(xs), ys: Object.values(ys) };
};

const getDataLength = (dataPath) => {
  // minus 1 due to header in csv
  return fs.readFileSync(dataPath, "utf-8").split("\n").length - 1;
};

const makeTrainingData = (path) => {
  return tf.data
    .csv("file://" + path, {
      columnConfigs: {
        label: {
          isLabel: true,
        },
      },
    })
    .map(csvTransform)
    .shuffle(100)
    .batch(100);
};

const makeTestData = (path, batchSize) => {
  return tf.data
    .csv("file://" + path, {
      columnConfigs: {
        label: {
          isLabel: true,
        },
      },
    })
    .map(csvTransform)
    .batch(batchSize);
};

/**
 *
 * @param epochCount
 * @param trainingDataPath
 * @param testDataPath
 * @param gestureClasses
 * @return {Promise<Sequential>}
 */
export async function train({
  epochCount,
  trainingDataPath,
  testDataPath,
  gestureClasses,
}) {
  const testDataLength = getDataLength(testDataPath);
  const trainingDataLength = getDataLength(trainingDataPath);

  const trainingData = makeTrainingData(trainingDataPath);

  const testData = makeTestData(testDataPath, testDataLength);

  /**
   * Define the model
   */
  const model = tf.sequential();

  /**
   * Adding layers.
   * Note the input shape of 42 corresponds to our 21 * 2 fingerjoints.
   * We have flattened our 21 finger joints to 42 individual x and y values
   *
   */
  model.add(
    tf.layers.dense({ units: 250, activation: "relu", inputShape: [42] })
  );
  model.add(tf.layers.dense({ units: 175, activation: "relu" }));
  model.add(tf.layers.dense({ units: 150, activation: "relu" }));
  /**
   * The last layer should have as many units as you have gestures
   */
  model.add(tf.layers.dense({ units: gestureClasses, activation: "softmax" }));

  model.compile({
    /**
     * What type of 'loss' function to use
     * A neural net learns by comparing the actual label of a gesture with the predicted outcome
     * The difference (in probability) between actual outcome and predicted is what we call loss
     * There are many function with different implementations to calculate 'loss'.
     * You can try a few:
     * https://towardsdatascience.com/understanding-different-loss-functions-for-neural-networks-dd1ed0274718
     */
    loss: "sparseCategoricalCrossentropy",
    /**
     * The function which we use to 'optimize' the loss function. It influences how the weights (between the neurons)
     * are adjusted.
     * see https://towardsdatascience.com/optimizers-for-training-neural-network-59450d71caf6
     * For small dataset training time is not really something to take into account. But for larger dataset
     * training time on those expensive GPU's does become an issue. The optimizer can have dramatic influence
     * on training time
     */
    optimizer: tf.train.adam(),
    metrics: ["accuracy"],
  });

  model.summary();

  /**
   * Start the actual training!
   */
  await model.fitDataset(trainingData, {
    /**
     * Determines how many cycles we go through the network.
     * In each cycle the weights between the neurons are a little bit adjusted the network predicts a little bit
     * better
     * Higher epoch counts means longer training. Inspect the logging and find your optimal number of epochs.
     */
    epochs: epochCount,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        console.log(`Epoch: ${epoch} - loss: ${logs.loss.toFixed(3)}`);
      },
    },
  });

  // Eval against test data:
  await testData.forEachAsync((data) => {
    const evalOutput = model.evaluate(data.xs, data.ys, testDataLength);

    console.log(
      `\nEvaluation result:\n` +
        `  Loss = ${evalOutput[0].dataSync()[0].toFixed(3)}; ` +
        `Accuracy = ${evalOutput[1].dataSync()[0].toFixed(3)}`
    );
  });

  return model;
}
