import fs from "fs";
import path from "path";
import Fastify from "fastify";
import("@tensorflow/tfjs-node");

import { writeData } from "./utils/write-data.js";
import { train } from "./model/model.js";

const PORT = 4000;

const cwd = process.cwd();
const dataRoot = path.resolve(cwd, "./data");
const staticRoot = "public/";

// Require the framework, with a 10mb body limit for incoming requests (training data can quickly become huge)
const fastify = Fastify({ logger: true, bodyLimit: 1048576 * 10 });

fastify.register(import("fastify-cors"), { origin: true });

// create the static folder for our trained model
fastify.register(import("fastify-static"), {
  root: path.join(process.cwd(), "public"),
});

fastify.get("/", (request, reply) => {
  const stream = fs.createReadStream(
    path.join(process.cwd(), "public", "index.html")
  );
  reply.type("text/html").send(stream);
});

// the route for handling training data
fastify.post("/training", async (request, reply) => {
  const data = JSON.parse(request.body);

  const trainDataPath = dataRoot + "/train.csv";
  const testDataPath = dataRoot + "/test.csv";
  const modelPath = `models/${data.metaData.recordId}`;
  const modelRoot = staticRoot + modelPath;

  /**
   * Writing the data to csv files
   * So tensor flow can load it later
   */
  writeData(data.recordedGestures, trainDataPath, testDataPath);

  /**
   * Start the magic!
   */
  const model = await train({
    epochCount: 25,
    gestureClasses: data.recordedGestures.length,
    trainingDataPath: trainDataPath,
    testDataPath: testDataPath,
  });

  /**
   * Save the model in the static folder so that FE can retrieve it
   */
  await model.save(`file://${path.resolve(cwd, modelRoot)}`);

  if (!fs.existsSync(modelRoot)) {
    fs.mkdirSync(modelRoot);
  }
  fs.writeFileSync(
    path.resolve(modelRoot, "meta.json"),
    JSON.stringify(data.metaData, null, 2),
    {
      flag: "w",
    }
  );

  return { message: "Training done", modelUrl: "/" + modelPath };
});

// Run the server!
fastify.listen(PORT, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log("fastify listening on", PORT);
});
