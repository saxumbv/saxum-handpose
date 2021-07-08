import React, {
  FunctionComponent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { load, HandPose } from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";
import Stats from "stats.js";
import HandPoseContext from "./HandPoseContext";
import { makeBoundingBox, normalise } from "./utils/utils";
import { AnnotatedPredictionNormalized } from "./types";

export type HandPoseProviderProps = {
  sourceSize: number
};

/**
 * Setup the 'debug' video.
 * Note that it is not required to actually show the
 * video in the UI, but it is nice for debugging purposes
 */
export const setupVideo = (
  size: number,
): Promise<HTMLVideoElement> => {
  const video = document.getElementById("react-posenet-video");
  let v = video as HTMLVideoElement;

  if (video === null) {
    v = document.createElement("video") as HTMLVideoElement;
    v.id = "react-posenet-video";
    v.width = size;
    v.height = size;
    v.style.position = "fixed";
    v.style.top = "10px";
    v.style.right = "10px";
    document.body.appendChild(v);
  }

  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: size,
          height: size,
        },
      })
      .then((stream) => {
        v.srcObject = stream;
        v.onloadeddata = (e) => {
          // trying to fight an error thrown by tensorflow when the app is hot reloaded during development
          resolve(v);
        };
      })
      .catch(console.error);
  });
};

export const HandPoseProvider: FunctionComponent<HandPoseProviderProps> = ({
  children,
    sourceSize
}) => {
  // the stats gives us information about frames per second
  const statsRef = useRef(new Stats());
  const requestRef = useRef(0);

  const [net, setNet] = useState<HandPose>();
  const [video, setVideo] = useState<HTMLVideoElement>();
  const [hands, setHands] = useState<AnnotatedPredictionNormalized[]>([]);

  useLayoutEffect(() => {
    // load the hand pose model and video
    Promise.all([
        setupVideo(sourceSize),
        // here we load the HandPose model, making it ready to do detection
        load({maxContinuousChecks: 1})
    ]).then(([vid, net])=>{
      setVideo(vid)
      setNet(net)
    })
  }, [sourceSize]);

  /**
   * Add the stats panel to the DOM
   */
  useEffect(() => {
    statsRef.current.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(statsRef.current.dom);
  }, []);

  /**
   * Effect callback to startoff continous detection
   */
  useEffect(() => {
    const animate = async () => {
      statsRef.current.begin();
      if (video && net) {

        /**
         * Here we do the actual handpose detection
         */
        const estimatedHands = await net.estimateHands(video, false);
        if (
          estimatedHands.length > 0 &&
          estimatedHands[0].handInViewConfidence > 0.8
        ) {
          /**
           * HandPose does already provide us with a bounding box
           * but it seems not super accurate, e.g. the hand falls
           * outside the BBOX, here we calculate the bounding box
           * on the actual finger coordinates
           */
          const estimatedHandsWithBBox = makeBoundingBox(estimatedHands);

          /**
           * Normalise the landmarks to the bounding box.
           * That yields better results when training.
           */
          const estimatedHandsNormalized = normalise(estimatedHandsWithBBox);

          /**
           * Set the detected hands on the state, allowing them to be
           * broadcasted over the context.
           */
          setHands(estimatedHandsNormalized);
        } else {
          setHands([]);
        }

        statsRef.current.end();
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (video && net) {
      video.play();
      requestRef.current = requestAnimationFrame(animate);
      /**
       * Kickoff detection
       */
      animate();
    }
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [net, video]);

  /**
   * Provide the consumers with some hands
   */
  return (
    <HandPoseContext.Provider
      value={{
        hands,
      }}
    >
      {children}
    </HandPoseContext.Provider>
  );
};
