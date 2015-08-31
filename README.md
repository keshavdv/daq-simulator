## About

This package provides a device simulator for the Hermes protocol that can be used to test the GUI application. It also provides a comprehensive set of integration tests that can be used to test against specific hardware implementations.

To install dependencies run:

    npm install -g mocha
    npm install
    make

To start the simulated DAQ:

    node daq.js

To run the tests:

   	make test # defaults to testing localhost:5000
    HOST=<host> PORT=<port> make test # optionally specify a remote DAQ to test against

 


