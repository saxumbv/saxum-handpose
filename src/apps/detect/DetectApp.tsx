import React, { useContext, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { useLocation } from "react-router";
import {Alert, Col, Container, Row, Spinner, Table} from "react-bootstrap";
import HandPoseContext from "../../lib/HandPoseContext";
import { RecordMetaData } from "../record/TrainerApp";
import { HandVisualizer } from "../../lib/visualizer/HandVisualizer";

type Props = {
  sourceSize: number;
};

export const DetectApp = ({ sourceSize }: Props) => {
  const { hands } = useContext(HandPoseContext);
  const location = useLocation();

  const [loading, setLoading] = useState<any>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [model, setModel] = useState<any>();
  const [modelMeta, setModelMeta] = useState<RecordMetaData>();
  const [detectionResult, setDetectionResult] = useState<Array<number>>([]);

  /**
   * Load the model from our server
   */
  useEffect(() => {
    const fetchData = async (url: string) => {
      setLoading(true);
      const model = await tf.loadLayersModel(url + "/model.json");
      const metaResult = await fetch(url + "/meta.json");
      // @ts-ignore
      const metaData: RecordMetaData = await metaResult.json();
      setModelMeta(metaData);
      setModel(model);
    };

    const modelUrl = new URLSearchParams(location.search).get("modelUrl");
    if(!modelUrl){
      setLoadError(true)
    } else {
      try {
        fetchData(modelUrl);
      } catch (e) {
        setLoadError(true)
        console.error(e);
      } finally {
        setLoading(false);
      }
    }



  }, [location]);

  /**
   * Detect a gesture
   */
  useEffect(() => {
    if (model && hands[0]) {
      /**
       * The hand is represented by an array of 21 finger joints.
       * Each joint is basically a position in 3D, but our model is trained on only the XY value.
       * Therefore we get only those values in the map.
       *
       * Furthermore, we have trained the model with flat arrays (see write-data.js in server).
       * When doing detection, we should always make sure that the data we use as input is in
       * the same structure as the data the model was trained on. Hence we call array.flat(),
       * creating a flat array of 2 * 21 landmarks == 42 landmarks.
       */
      const flattenedLandmarks = hands[0]?.landmarksNormalized
        .map((lm) => [lm[0], lm[1]])
        .flat() || [];

      /**
       * tf.tensor by default returns a 2d tensor, which we need to reshape
       */
      const result = model
        .predict(tf.tensor(flattenedLandmarks).reshape([-1, 42]))
        .arraySync();
      setDetectionResult(result[0]);
    }
  }, [hands, model]);

  /**
   * Get the label the model is most confident about
   */
  const detectedGesture = modelMeta?.gestures?.reduce(
    // @ts-ignore
    (acc, curr, idx) => {
      // @ts-ignore
      if (detectionResult[idx] > acc.result) {
        return {
          label: curr.label,
          result: detectionResult[idx],
        };
      }
      return acc;
    },
    { label: "", result: 0 }
  );

  return (
    <Container className="app-container">
      <Row>
        <Col lg={4}>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Id</th>
                <th>Gesture</th>
                <th>Confidence Score</th>
              </tr>
            </thead>
            <tbody>
              {modelMeta?.gestures?.map(({ label, id }, index) => {
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{label}</td>
                    <td>{detectionResult[index]?.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Col>
        <Col className="hand-visualizer">
          {loadError && <Alert variant="danger">Cannot get a model... Did you train it first?</Alert>}
          {loading && <Spinner animation="border" />}
          {!loading && !loadError && (
            <>
              <div className="record-info">
                <h2>{detectedGesture?.label}</h2>
              </div>
              <HandVisualizer sourceSize={sourceSize} />
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};
