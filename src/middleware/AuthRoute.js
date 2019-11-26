import React from "react";
import Auth from "./Auth"
import {
    Route,
    Redirect,
  } from "react-router-dom";

function AuthRoute({ children, ...rest }) {
    return (
      <Route
        {...rest}
        render={({ location }) =>
        Auth.Check() ? (
            children
          ) : (
            <Redirect
              to={{
                pathname: "/Login",
                state: { from: location }
              }}
            />
          )
        }
      />
    );
  }

export default AuthRoute