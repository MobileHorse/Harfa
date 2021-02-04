
import React, { Component } from 'react';
import {View, Image, TouchableOpacity} from 'react-native';

export default class HeaderComponent extends Component {

    render() {
        return (
            <View style={{
                height: 55,
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center'
            }}>
                <TouchableOpacity style={{marginLeft:10}}
                    onPress={() => {
                        const { navigate } = this.props.navigation;
                        navigate.openDrawer();
                    }}>
                    <Image
                        style={{width:32, height: 32}}
                        source={require('../icons/humberger.png')}>
                    </Image>   

                </TouchableOpacity>    

            </View>
        );
    }
}