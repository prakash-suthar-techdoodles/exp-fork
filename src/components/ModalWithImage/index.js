import React from 'react';
import PropTypes from 'prop-types';
import {
    Image, TouchableOpacity, Dimensions
} from 'react-native';
import styles from '../../styles/StyleSheet';
import Str from '../../libs/Str';
import PDFView from '../PDFView';
import ImageView from '../ImageView';
import BaseModal from '../BaseModal';

/**
 * Image modal component that is triggered when pressing on an image
 * On web, we indicate that the modal isn't pinned to edges with props to BaseModal
 */

const propTypes = {
    // URL to image preview
    previewSourceURL: PropTypes.string,

    // URL to full-sized image
    sourceURL: PropTypes.string,
};

const defaultProps = {
    previewSourceURL: '',
    sourceURL: '',
};

class ModalWithImage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            imgWidth: 200,
            imgHeight: 200,
            thumbnailWidth: 300,
            thumbnailHeight: 150,
            visible: false,
        };
    }

    componentDidMount() {
        // Scale image for modal view
        Image.getSize(this.props.sourceURL, (width, height) => {
            const screenWidth = Dimensions.get('window').width * 0.6;
            const scaleFactor = width / screenWidth;
            const imageHeight = height / scaleFactor;
            this.setState({imgWidth: screenWidth, imgHeight: imageHeight});
        });

        // Scale image for thumbnail preview
        Image.getSize(this.props.previewSourceURL, (width, height) => {
            const screenWidth = 300;
            const scaleFactor = width / screenWidth;
            const imageHeight = height / scaleFactor;
            this.setState({thumbnailWidth: screenWidth, thumbnailHeight: imageHeight});
        });
    }

    /**
     * Updates the visibility of the modal
     *
     * @param {Boolean} visibility
     */
    setModalVisiblity = (visibility) => {
        this.setState({visible: visibility});
    }


    render() {
        return (
            <>
                <TouchableOpacity onPress={() => this.setModalVisiblity(true)}>
                    <Image
                        source={{uri: this.props.previewSourceURL}}
                        style={{width: this.state.thumbnailWidth, height: this.state.thumbnailHeight}}
                    />
                </TouchableOpacity>

                <BaseModal
                    pinToEdges={false}
                    title="Attachment"
                    visible={this.state.visible}
                    setModalVisiblity={this.setModalVisiblity}
                >
                    {(Str.isPDF(this.props.sourceURL)) ? (
                        <PDFView
                            sourceURL={this.props.sourceURL}
                            style={styles.imageModalPDF}
                        />
                    ) : (
                        <ImageView
                            imageWidth={this.state.imgWidth}
                            imageHeight={this.state.imgHeight}
                            sourceURL={this.props.sourceURL}
                        />
                    )}
                </BaseModal>
            </>
        );
    }
}

ModalWithImage.propTypes = propTypes;
ModalWithImage.defaultProps = defaultProps;

export default ModalWithImage;
