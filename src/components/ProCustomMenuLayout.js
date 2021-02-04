
import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableHighlight, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { connect } from 'react-redux';
import { notificationsFetched } from '../Redux/Actions/notificationActions';
import { DrawerActions } from 'react-navigation-drawer';
import ProDialogLogout from './ProDialogLogout';
import { colorPrimary } from '../Constants/colors';

class CustomMenuLayout extends Component {
    constructor(props) {
        super();
        this.state = {
            isDialogLogoutVisible: false
        };
    };

    changeDialogVisibility = bool => {
        this.props.navigation.dispatch(DrawerActions.closeDrawer());
        this.setState({
            isDialogLogoutVisible: bool
        });
    }

    render() {
        const { notificationsInfo, fetchedNotifications, userInfo: { providerDetails } } = this.props;
        const imageSource = providerDetails.imageSource;
        return (
            <TouchableOpacity activeOpacity={1} style={styles.drawerTransparent}>
                <TouchableOpacity activeOpacity={1} style={styles.drawer} disabled={false}>
                    <ScrollView>
                        <View style={styles.header}>
                            <Image source={{ uri: imageSource }} style={styles.headerImage} />
                            <Text style={{
                                fontSize: 12, color: 'white',
                                alignItems: 'center', justifyContent: 'center', marginTop: 5,
                            }}>
                                Welcome</Text>
                            <Text style={[styles.textHeader, { color: 'white' }]}>{providerDetails.name + " " + providerDetails.surname}</Text>
                        </View>

                        <TouchableHighlight underlayColor={'rgba(0,0,0,0.2)'}
                            onPress={() => {
                                this.props.navigation.navigate("ProDashboard")
                                this.props.navigation.dispatch(DrawerActions.closeDrawer())
                            }}>
                            <View style={styles.row}>
                                <Image source={require('../icons/ic_home_64dp.png')} style={styles.menuImage} />
                                <Text style={styles.textMenu}>Maison</Text>
                            </View>
                        </TouchableHighlight>

                        <TouchableHighlight underlayColor={'rgba(0,0,0,0.2)'}
                            onPress={() => {
                                this.props.navigation.navigate("ProMyProfile");
                                this.props.navigation.dispatch(DrawerActions.closeDrawer())
                            }}>
                            <View style={styles.row}>
                                <Image source={require('../icons/ic_user_64dp.png')} style={styles.menuImage} />
                                <Text style={styles.textMenu}>Mon profil</Text>
                            </View>
                        </TouchableHighlight>

                        <TouchableHighlight underlayColor={'rgba(0,0,0,0.2)'}
                            onPress={() => {
                                this.props.navigation.navigate("ProBooking")
                                this.props.navigation.dispatch(DrawerActions.closeDrawer())
                            }}>
                            <View style={styles.row}>
                                <Image source={require('../icons/booking_history.png')} style={styles.menuImage} />
                                <Text style={styles.textMenu}>Réservations</Text>
                            </View>
                        </TouchableHighlight>

                        <TouchableHighlight underlayColor={'rgba(0,0,0,0.2)'}
                            onPress={() => {
                                fetchedNotifications({ type: 'generic', value: 0 });
                                this.props.navigation.navigate("ProNotifications")
                                this.props.navigation.dispatch(DrawerActions.closeDrawer())
                            }}>
                            <View style={styles.row}>
                                <Image source={require('../icons/ic_notification.png')} style={styles.menuImage} />
                                <Text style={styles.textMenu}>Notifications</Text>
                                {notificationsInfo.generic > 0 ? <Text style={styles.menuNotifications}>{notificationsInfo.generic}</Text> : null}
                            </View>
                        </TouchableHighlight>

                        <TouchableHighlight underlayColor={'rgba(0,0,0,0.2)'}
                            onPress={() => {
                                fetchedNotifications({ type: 'messages', value: 0 });
                                this.props.navigation.navigate("ProAllMessage")
                                this.props.navigation.dispatch(DrawerActions.closeDrawer())
                            }}>
                            <View style={styles.row}>
                                <Image source={require('../icons/message.png')} style={styles.menuImage} />
                                <Text style={styles.textMenu}>Message</Text>
                                {notificationsInfo.messages > 0 ? <Text style={styles.menuNotifications}>{notificationsInfo.messages}</Text> : null}
                            </View>
                        </TouchableHighlight>

                        <TouchableHighlight underlayColor={'rgba(0,0,0,0.2)'}
                            onPress={() => {
                                fetchedNotifications({ type: 'adminMessages', value: 0 });
                                this.props.navigation.navigate("ChatWithAdmin")
                                this.props.navigation.dispatch(DrawerActions.closeDrawer())
                            }}>
                            <View style={styles.row}>
                                <Image source={require('../icons/message.png')} style={styles.menuImage} />
                                <Text style={styles.textMenu}>Chat with Admin</Text>
                                {notificationsInfo.admin > 0 ? <Text style={styles.menuNotifications}>{notificationsInfo.admin}</Text> : null}
                            </View>
                        </TouchableHighlight>

                        <TouchableHighlight underlayColor={'rgba(0,0,0,0.2)'}
                            onPress={() => {
                                this.props.navigation.navigate("AboutUs")
                                this.props.navigation.dispatch(DrawerActions.closeDrawer())
                            }}>
                            <View style={styles.row}>
                                <Image source={require('../icons/ic_aboutus_64dp.png')} style={styles.menuImage} />
                                <Text style={styles.textMenu}>À propos de nous</Text>
                            </View>
                        </TouchableHighlight>

                        <TouchableHighlight underlayColor={'rgba(0,0,0,0.2)'}
                            onPress={() => this.changeDialogVisibility(true)}>
                            <View style={styles.row}>
                                <Image source={require('../icons/ic_logout.png')} style={styles.menuImage} />
                                <Text style={styles.textMenu}>Déconnexion</Text>
                            </View>
                        </TouchableHighlight>

                        <Modal transparent={true} visible={this.state.isDialogLogoutVisible} animationType='fade'
                            onRequestClose={() => this.changeDialogVisibility(false)}>
                            <ProDialogLogout navigation={this.props.navigation} changeDialogVisibility={this.changeDialogVisibility} />
                        </Modal>

                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({

    drawerTransparent: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    drawer: {
        flex: 1,
        width: '100%',
        backgroundColor: 'white',
    },
    menuNotifications: {
        position: 'absolute',
        textAlignVertical: 'center',
        textAlign: 'center',
        borderRadius: 12,
        color: 'white',
        right: 10,
        top: 15,
        height: 24,
        width: 24,
        backgroundColor: 'red',
    },
    header: {
        width: '100%',
        height: 150,
        backgroundColor: colorPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerImage: {
        width: 80,
        height: 80,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textHeader: {
        fontSize: 18,
        color: '#111',
        fontWeight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
    },
    menuImage: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 5,
    },
    textMenu: {
        fontSize: 16,
        color: '#111',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 15,
        paddingLeft: 10,

    },
    line: {
        width: '90%',
        alignSelf: 'center',
        height: 1,
        backgroundColor: 'gray',
        margin: 15,
    },
});

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        userInfo: state.userInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchedNotifications: data => {
            dispatch(notificationsFetched(data));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CustomMenuLayout);