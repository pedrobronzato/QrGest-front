import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Text, View } from 'react-native';

type TitleProps = {
  children: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
};

export const GradientTitle = ({ children, fontSize = 32, textAlign = 'center' }: TitleProps) => {
  const renderFallbackTitle = () => (
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
      alignItems: 'center',
    }}>
      <Text
        style={{
          fontSize,
          fontFamily: 'Montserrat-Bold',
          color: '#005DFF',
          textAlign,
        }}
      >
        {children}
      </Text>
    </View>
  );

  if (Platform.OS === 'web') {
    return renderFallbackTitle();
  }

  try {
    return (
      <View style={{ 
        width: '40%',
        justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        alignItems: 'center'
      }}>
        <MaskedView
          style={{ 
            flexDirection: 'row', 
            height: fontSize + 10,
            minHeight: fontSize,
            width: '100%'
          }}
          maskElement={
            <View
              style={{
                backgroundColor: 'transparent',
                justifyContent: 'center',
                alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
                flex: 1
              }}
            >
              <Text
                style={{
                  fontSize,
                  fontFamily: 'Montserrat-Bold',
                  color: 'black',
                  textAlign,
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                }}
              >
                {children}
              </Text>
            </View>
          }
        >
          <LinearGradient
            colors={['#005DFF', '#00D26A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ 
              flex: 1
            }}
          />
        </MaskedView>
      </View>
    );
  } catch (error) {
    console.warn('MaskedView failed, using simple text fallback:', error);
    return renderFallbackTitle();
  }
};
