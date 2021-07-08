import argparse from "argparse";
import { train } from "../src/model/model.js";
import path from "path";

const parser = new argparse.ArgumentParser({
  description: "TensorFlow.js Hand Gesture Training",
  addHelp: true,
});

parser.addArgument("--epochs", {
  type: "int",
  defaultValue: 20,
  help: "Number of epochs to train the model for.",
});

parser.addArgument("--n_classes", {
  type: "int",
  help: "the amount gestures types in your data",
});

parser.addArgument("--train_data_path", {
  type: "string",
  help: "Path to training data csv",
});

parser.addArgument("--test_data_path", {
  type: "string",
  help: "Path to test data csv",
});

parser.addArgument("--model_save_path", {
  type: "string",
  help: "Path to which the model will be saved after training.",
});

const args = parser.parseArgs();

const main = async ()=>{
  const model = await train({
    epochCount: args.epochs,
    gestureClasses: args.n_classes,
    trainingDataPath: path.resolve(process.cwd(), args.train_data_path),
    testDataPath: path.resolve(process.cwd(), args.test_data_path),
  });

  await model.save(`file://${args.model_save_path}`);
}

try{
  main()
} catch (e) {
  console.error('Bleh, something wrong with training')
}
