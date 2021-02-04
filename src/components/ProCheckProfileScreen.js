import React, { Component } from 'react';
import {View, StyleSheet, Image, Dimensions, TouchableOpacity, Text} from 'react-native';
import { colorPrimary, colorBg, colorYellow } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;

export default class ProCheckProfileScreen extends Component {
  render() {
    return (
      <View style={styles.container}> 
        <View style={{
          flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
          paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5
          }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <TouchableOpacity style={{ width: 20, height: 20, alignSelf: 'center' }}
              onPress={() => this.props.navigation.goBack()}>
              <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                source={require('../icons/arrow_back.png')} />
            </TouchableOpacity>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
              Laabhaa Technology
            </Text>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <Image style={{ width: 90, height: 90, borderRadius: 100, borderColor: colorYellow, borderWidth: 2, }}
            source={{ uri: 'https://cdn.luxe.digital/media/sites/7/2019/02/05102520/business-professional-dress-code-men-james-bond-suit-style-luxe-digital.jpg' }}>
          </Image>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15 }}>Laabhaa Technology</Text>

          <Text style={{ fontSize: 14, alignItems: 'center', textAlign: 'center', marginTop: 5}}>11, Asha nagar, near Bangali square, Indore, Madhya Pradesh</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <Image style={{ width: 15, height: 15 }}
              source={require('../icons/mobile.png')} />
            <Text style={{ fontSize: 14, marginLeft: 10}}>9789876876</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
            <Image style={{ width: 15, height: 15 }}
              source={require('../icons/calendar.png')} />
            <Text style={{ fontSize: 14, marginLeft: 10}}>10/Dec/1995</Text>
          </View>

          <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 }}
            onPress={() => this.props.navigation.goBack()}>
            <Image style={{ width: 15, height: 15 }}
              source={require('../icons/back_arrow_double.png')} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 10}}>Back</Text>
          </TouchableOpacity>

        </View>

      </View>
    );
  }
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: colorBg,
      },
      mainContainer: {
        width: screenWidth-20,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        marginTop: 10,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 2,
       
      },
});