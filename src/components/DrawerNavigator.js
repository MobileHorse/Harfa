
import React, { Component } from 'react';
import { createAppContainer } from 'react-navigation';
import { createDrawerNavigator } from 'react-navigation-drawer';
import DashboardScreen from './DashboardScreen';
import MapDirectionScreen from './MapDirectionScreen';
import AccountTypeScreen from './AccountTypeScreen';
import AfterSplashScreen from './AfterSplashScreen';
import CustomMenuLayout from './CustomMenuLayout';
import ChatScreen from './ChatScreen';
import ChatWithAdminScreen from './ChatWithAdminScreen';
import ChatAfterBookingDetailsScreen from './ChatAfterBookingDetailsScreen';
import AboutUsScreen from './AboutUsScreen';
import ContactUsScreen from './ContactUsScreen';
import MyProfileScreen from './MyProfileScreen';
import AllMessageScreen from './AllMessageScreen';
import NotificationsScreen from './NotificationsScreen';
import BookingScreen from './BookingScreen';
import BookingDetailsScreen from './BookingDetailsScreen';
import ProFacebookGoogleScreen from './ProFacebookGoogleScreen';
import ProviderDetailsScreen from './ProviderDetailsScreen';
import ProAccountTypeScreen from './ProAccountTypeScreen';
import ListOfProviderScreen from './ListOfProviderScreen';
import FacebookGoogleScreen from './FacebookGoogleScreen';
import AddAddressScreen from './AddAddressScreen';
import ProDrawerNavigator from './ProDrawerNavigator' ;

const MyDrawerNavigator = createDrawerNavigator({
    ProDashboard: { screen: ProDrawerNavigator },
    FacebookGoogle: { screen: FacebookGoogleScreen},
    ProDashboard: { screen: () => <ProDrawerNavigator /> },
    MapDirection: { screen: MapDirectionScreen },
    AfterSplash: { screen: AfterSplashScreen },
    AccountType: { screen: AccountTypeScreen },
    Chat: { screen: ChatScreen},
    Home: { screen: DashboardScreen },
    ProHome: { screen: () => <ProDrawerNavigator /> },
    ProAccountType: { screen: ProAccountTypeScreen },
    Dashboard: { screen: DashboardScreen },
    ProviderDetails: { screen: ProviderDetailsScreen },
    ProFacebookGoogle: { screen: ProFacebookGoogleScreen },
    ListOfProviders: { screen: ListOfProviderScreen },
    AddAddress: { screen: AddAddressScreen },
    MyProfile: { screen: MyProfileScreen },
    Booking: { screen: BookingScreen },
    BookingDetails: { screen: BookingDetailsScreen },
    AboutUs: { screen: AboutUsScreen },
    ChatWithAdmin: { screen: ChatWithAdminScreen },
    ChatAfterBookingDetails: { screen: ChatAfterBookingDetailsScreen },
    ContactUs: { screen: ContactUsScreen },
    AllMessage: { screen: AllMessageScreen },
    Notifications: { screen: NotificationsScreen },
},
    {
        initialRouteName: 'Dashboard',
        drawerWidth: 275,
        drawerPosition: 'left',
        drawerType: "push-screen",
        contentComponent: CustomMenuLayout,
    }
);

const AppContainer = createAppContainer(MyDrawerNavigator);

export default class DrawerNavigator extends Component {
    render() {
        return <AppContainer />
    }
}