import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { TrainerApp } from "../record/TrainerApp";
import { DetectApp } from "../detect/DetectApp";
import { Button, Nav, Navbar } from "react-bootstrap";
import { HandPoseProvider } from "../../lib/HandPoseProvider";

import "./style.css";

const SOURCE_SIZE = 256;

function App() {
  return (
    <HandPoseProvider sourceSize={SOURCE_SIZE}>
      <Router>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home">HandPose Demo</Navbar.Brand>
          <Nav className="me-auto">
            <Link to="/training">
              <Button variant="link">Record & Train</Button>
            </Link>
            <Link to="/detection">
              <Button variant="link">Detection</Button>
            </Link>
          </Nav>
        </Navbar>
        <Switch>
          <Route path="/training">
            <TrainerApp sourceSize={SOURCE_SIZE} />
          </Route>
          <Route path="/detection">
            <DetectApp sourceSize={SOURCE_SIZE} />
          </Route>
        </Switch>
      </Router>
    </HandPoseProvider>
  );
}

export default App;
