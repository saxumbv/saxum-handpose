# Gesture detection with TensorFlowJS

Sample app to demonstrate training and detection of gesture with [TensorFlowJS](https://www.tensorflow.org/js/) and the pretrained [HandPose](https://github.com/tensorflow/tfjs-models/tree/master/handpose) model.

### Deeplearning, TensorFlow and HandPose

TensorFlow is a machine learning framework for training neural networks. HandPose is an already trained neural network (or what data people call model) for "detecting hand landmarks in a live video stream". 

Not entirely sure what a Neural Network is? Check the first 3 minutes of [this video](https://www.youtube.com/watch?v=bfmFfD2RIcg&ab_channel=Simplilearn) for a refresher. It will touch on all the jargon used in this readme and comments in the code!

The output consists of float indicating the detection confidence and an array of hand landmarks. One such landmark is a 3d position of a finger joint.

See [HandPose](https://github.com/tensorflow/tfjs-models/tree/master/handpose) for the exact structure of detection. 

### Sample app for training

> Goal: detect hand gestures in a video stream.

Although HandPose gives us information about where the hand landmarks are in the video stream, it doesnt tell us **what the hand is actually doing**.

For that we are going to record a bunch of gestures, train a new model with TensorFlow and use that model to detect those gestures!

### Training

When you run the app you can go to "Record & Train" where you can, indeed, record and train gestures.\
Training in any machine learning frameworks works by giving the framework a bunch of labelled observations.\
Add a label and hold your hand in front of the camera. Perform the gesture you want to record (perhaps a peace sign) and hit space bar to record a series of those landmark areas we talked earlier.\
The app will tell you how many samples you collected for that gesture.

Humans understand gestures regardless of the orientation (i.e. we understand that a peace sign is a peace sign even when rotated 90 degrees). You will train a **more robust model** when you record a particular gesture in a few orientations.

I had good results when recording 10 frames for 5 orientations with 5 gestures. But the more gestures you record the more examples you need to give to the framework in order to create a robust model. Experiment a bit, see what works!

Once you have recorded a few gestures, hit training button. This will:

* send the recorded gestures to the backend (make sure its running, see available scripts section below):
* start the training
* send you back a link pointing to trained model

Click the link, this will take you to the detect app where you test your model.

### Experimenting with training params

Once you have send the recorded gestures, the server wirtes the data to a csv in the `server/data` folder.

Its a bit cumbersome to re-record gestures everytime you made adjustments to the trainings script in `server/src/model/model.js`.\
Actually, you want to keep the source data the same, so that you can be sure that the model your trained with your adjusted parameters is performing better.

Fortunately there is a script in the `server` folder which can help you there:

```
yarn train -- --train_data_path="./data/train.csv" --test_data_path="./data/test.csv" --model_save_path='./public/models/default' --n_classes=4
```

Try adjusting layers (add some layers, change their sizes, change the activation function), and see whether you can up the accuracy of your model with lower training times ;) 

## Development

### Installing

Run `yarn install` and `cd server && yarn install` to install both frontend and server.

### Available Scripts

In the project directory, you can run:

#### `yarn start:server`

Starts the server where we will train the model. 

#### `yarn start`

Runs the frontend app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint and comilation errors in the console.

#### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is moved to the server directory where it is served on the root, `localhost:4000`.

#### `yarn train` (in server dir)

Runs a training cycle on the data taht you provide. See `yarn train --help` for options. 
### Directory structure 

The `src` directory contains all frontend code. In `src/lib` you'll find all code related to loading the HandPose model and providing it over a context. There you also find a `HandVisualizer` component which draws the detected hand on a canvas.

All server related code is in the `server` directory. The entry points are in `server/server.js`. That's also where we start training directly from the endpoint (probably a bad idea for a production app).

## Next Steps

Some ideas to implement:

* Currently we use 2D data which we flatten. Can you refactor so that we can use the 3D positions directly? 
* The detected gestures are single frame only. But some gestures are time based, like a Swipe of a Wave. Can you use a [Long Short Term Memory](https://js.tensorflow.org/api/latest/#Layers-Recurrent) to train a model on a sequence of dataframes?  
* HandPose is just one of the models provided. With BodyPose you can track the human skeleton. Can you create a yoga position detector? 

Hope this inspires some!
