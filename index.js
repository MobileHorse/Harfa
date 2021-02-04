import 'react-native-gesture-handler';
import React from 'react';
import {AppRegistry} from 'react-native';
import App from './src/components/SplashScreen';
import {name as appName} from './app.json';
import configureStore from './store';
import { Provider } from 'react-redux';

const store = configureStore();

console.disableYellowBox = true;

const IniApp = () => (
    <Provider store = { store }> 
        <App /> 
    </Provider>
);

AppRegistry.registerComponent(appName, () => IniApp );
