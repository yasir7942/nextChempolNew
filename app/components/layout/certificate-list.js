"use client"; 

import React, { useState } from 'react';
import ModalImage from 'react-modal-image';
import Modal from 'react-modal';
import { getImageUrl } from '@/libs/helper';


  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
    },
  };
  

 const CertificateList = ({ CertificatesData }) => { 

     console.dir(CertificatesData, { depth:null}); 

        const [modalIsOpen, setIsOpen] = useState(false);
        const [selectedImage, setSelectedImage] = useState(null);
    
        const openModal = (image) => {
            setSelectedImage(image);
            setIsOpen(true);
        };
    
        const closeModal = () => {
            setIsOpen(false);
            setSelectedImage(null);
        };
    
        return (
            <div className='text-white'> 
                {CertificatesData.map((CertiItems, parentIndex) => (
                    <div key={parentIndex}>
                        <h2 className='text-xl'>{CertiItems.title}</h2>
                        <ul className='bg-slate-300 inline-block'>
                            {CertiItems.certificates.data.map((item, itemIndex) => (
                                <li className='font-light cursor-pointer' key={itemIndex} onClick={() => openModal(getImageUrl(item.certificateImages.url))}>
                                    {item.title } 
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <Modal
                    isOpen={modalIsOpen}
                    onRequestClose={closeModal}
                    style={customStyles}
                    contentLabel="Certification or Approval">
                    {selectedImage && <ModalImage small={selectedImage} large={selectedImage} />}
                    <button onClick={closeModal}>Close</button>
                </Modal>
            </div>
     )
    }
    
 
    export default CertificateList