import React, { useContext, useEffect, useMemo, useState } from "react";

import {
  Button,
  Col,
  Container,
  Form,
  FormControl,
  InputGroup,
  Row,
  Table,
} from "react-bootstrap";

import { Link } from "react-router-dom";
import HandPoseContext from "../../lib/HandPoseContext";
import { HandVisualizer } from "../../lib/visualizer/HandVisualizer";
import { TrainGestures } from "../../lib/types";

export type Props = { sourceSize: number };

export type RecordMetaData = {
  recordId: number;
  gestures: Array<{ id: number; label: string }>;
};

export const TrainerApp = ({ sourceSize }: Props) => {
  /**
   * The label for the current gesture
   */
  const [gestureLabel, setGestureLabel] = useState<string>("");

  /**
   * The id of the gesture currently being recorded
   */
  const [currGestureId, setCurrGestureId] = useState<number>();

  /**
   * Whether we are recording
   */
  const [recording, setRecording] = useState<boolean>(false);

  /**
   * The full collection of gestures
   */
  const [trainingGestures, setTrainingGestures] = useState<TrainGestures>([]);

  /**
   * The url where to download the model from
   */
  const [modelUrl, setModelUrl] = useState<string>();

  /**
   * The predicted hand pose
   */
  const { hands } = useContext(HandPoseContext);

  /**
   * Handle start training with some gesture meta data
   */
  const handleStartTraining = async () => {
    // create the metadata object
    const metaData: RecordMetaData = {
      recordId: new Date().getTime(),
      gestures: trainingGestures.map((tg) => ({
        id: tg.id,
        label: tg.label,
      })),
    };

    // send to server
    const response = await fetch("/training", {
      method: "POST",
      body: JSON.stringify({
        metaData,
        recordedGestures: trainingGestures,
      }),
    });

    const { modelUrl } = await response.json();

    setModelUrl(modelUrl);
  };

  /**
   * Handler for gesture add
   */
  const handleGestureAdd = (event: any) => {
    // don't submit the form
    event.preventDefault();

    // create a new gesture
    const gesture = {
      label: gestureLabel,
      id: trainingGestures.length,
      gestures: [],
    };

    // make it active and add to state
    setCurrGestureId(gesture.id);
    setTrainingGestures([...trainingGestures, gesture]);

    // reset the label
    setGestureLabel("");
  };

  /**
   * Here we record the current landmarks
   */
  useEffect(() => {
    if (recording && hands[0]) {
      setTrainingGestures((prev) => {
        // find the current active gesture
        const currentGestureIdx = prev.findIndex(
          (tg) => tg.id === currGestureId
        );

        if (currentGestureIdx !== -1) {
          const currentGesture = prev[currentGestureIdx];
          const newState = [...prev];

          // add the current landmark snapshot to the array of already recorded gestures
          newState[currentGestureIdx] = {
            ...currentGesture,
            gestures: [
              ...currentGesture.gestures,
              hands[0].landmarksNormalized,
            ],
          };

          return newState;
        }

        // nothing to update so return old state
        return prev;
      });
    }
  }, [recording, hands, currGestureId]);

  /**
   * Add space bar for record toggle
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setRecording(!recording);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [recording]);

  const activeGesture = useMemo(() => {
    return trainingGestures.find((tg) => tg.id === currGestureId);
  }, [currGestureId, trainingGestures]);

  return (
    <Container className="app-container">
      <Row>
        <Col lg={4} className="controls">
          <Row>
            <h3>Gestures:</h3>
            <Form onSubmit={handleGestureAdd}>
              <InputGroup className="mb-3">
                <FormControl
                  placeholder="Gesture name"
                  value={gestureLabel}
                  onChange={(e) => setGestureLabel(e.target.value.trim())}
                />
                <InputGroup.Append>
                  <Button variant="outline-primary" type="submit">
                    Add
                  </Button>
                </InputGroup.Append>
              </InputGroup>
            </Form>
          </Row>
          <Row noGutters={false}>
            <h3>Record controls:</h3>
            <span className="active-gesture">
              Gesture to record: {activeGesture?.label}
            </span>
            <Col>
              <Button
                color="primary"
                onClick={() => setRecording(!recording)}
                disabled={recording || !activeGesture}
              >
                Start record
              </Button>
            </Col>
            <Col>
              <Button
                variant="danger"
                onClick={() => setRecording(!recording)}
                disabled={!recording}
              >
                Stop record
              </Button>
            </Col>
            <Row>
              <Col>Tip: you can also toggle recording with Spacebar!</Col>
            </Row>
          </Row>
          <Row>
            <Col>
              <h3>Recorded gestures:</h3>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Gesture</th>
                    <th>Sample count</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingGestures.map((tg) => (
                    <tr key={tg.id}>
                      <td>{tg.id}</td>
                      <td>{tg.label}</td>
                      <td>{tg.gestures.length}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
          <Row>
            <Col>
              <h3>Training</h3>
              <p>Send recorded gestures to server and start training</p>
              <Button
                variant="success"
                onClick={handleStartTraining}
                disabled={trainingGestures.length === 0}
              >
                Start Training
              </Button>
              {modelUrl && (
                <p>
                  Training done! Click{" "}
                  <Link to={`/detection?modelUrl=${modelUrl}`}>here</Link> to
                  tryout detection!
                </p>
              )}
            </Col>
          </Row>
        </Col>
        <Col className="hand-visualizer">
          <div className="record-info">
            <h3>
              {recording &&
                `Recording ${activeGesture?.label}, record count: ${activeGesture?.gestures.length}`}
              {!recording &&
                activeGesture?.label &&
                `Hit space to start recording for ${activeGesture?.label}`}
            </h3>
          </div>
          <Row>
            <HandVisualizer sourceSize={sourceSize} />
          </Row>
        </Col>
      </Row>
    </Container>
  );
};
