import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Container } from 'reactstrap';
import NavBar from './NavBar';
import ErrorMessage from './ErrorMessage';
import Welcome from './Welcome';
import 'bootstrap/dist/css/bootstrap.css';
import config from './Config';
import { UserAgentApplication } from 'msal';
import { getUserDetails } from './GraphService';
import Calendar from './Calendar';
import { Client, ImplicitMSALAuthenticationProvider } from '@microsoft/microsoft-graph-client'
//const MicrosoftGraph = require("@microsoft/microsoft-graph-client");


class App extends Component {
  constructor(props) {
    super(props);

    
    this.userAgentApplication = new UserAgentApplication({
          auth: {
              clientId: config.appId
          },
          cache: {
              cacheLocation: "localStorage",
              storeAuthStateInCookie: true
          }
      });
  
    var user = this.userAgentApplication.getAccount();
  
    this.state = {
      isAuthenticated: (user !== null),
      user: {},
      error: null
    };
  
    const authProvider = new ImplicitMSALAuthenticationProvider(this.userAgentApplication, config.scopes);

    const client = Client.initWithMiddleware({
      authProvider, // An instance created from previous step
    });

    if (user) {
      // Enhance user object with data from Graph
      this.getUserProfile(client);
    }
  }

  async login() {
    try {
      await this.userAgentApplication.loginPopup(
          {
            scopes: config.scopes,
            prompt: "select_account"
        });
      await this.getUserProfile();
    }
    catch(err) {
      var error = {};
  
      if (typeof(err) === 'string') {
        var errParts = err.split('|');
        error = errParts.length > 1 ?
          { message: errParts[1], debug: errParts[0] } :
          { message: err };
      } else {
        error = {
          message: err.message,
          debug: JSON.stringify(err)
        };
      }
  
      this.setState({
        isAuthenticated: false,
        user: {},
        error: error
      });
    }
  }

  logout() {
    this.userAgentApplication.logout();
  }

  render() {
    let error = null;
    if (this.state.error) {
      error = <ErrorMessage message={this.state.error.message} debug={this.state.error.debug} />;
    }

    return (
      <Router>
        <div>
          <NavBar
  isAuthenticated={this.state.isAuthenticated}
  authButtonMethod={this.state.isAuthenticated ? this.logout.bind(this) : this.login.bind(this)}
  user={this.state.user}/>
          <Container>
            {error}
            <Route exact path="/"
              render={(props) =>
                <Welcome {...props}
  isAuthenticated={this.state.isAuthenticated}
  user={this.state.user}
  authButtonMethod={this.login.bind(this)} />
              } />
              <Route exact path="/calendar"
  render={(props) =>
    <Calendar {...props}
      showError={this.setErrorMessage.bind(this)} />
  } />
          </Container>
        </div>
      </Router>
    );
  }

  setErrorMessage(message, debug) {
    this.setState({
      error: {message: message, debug: debug}
    });
  }

  async getUserProfile(client) {
    try {

        // Get the user's profile from Graph
        var user = await getUserDetails(client);
        this.setState({
          isAuthenticated: true,
          user: {
            displayName: user.displayName,
            email: user.mail || user.userPrincipalName
          },
          error: null
        });
    }
    catch(err) {
      var error = {};
      if (typeof(err) === 'string') {
        var errParts = err.split('|');
        error = errParts.length > 1 ?
          { message: errParts[1], debug: errParts[0] } :
          { message: err };
      } else {
        error = {
          message: err.message,
          debug: JSON.stringify(err)
        };
      }
  
      this.setState({
        isAuthenticated: false,
        user: {},
        error: error
      });
    }
  }
}

export default App;