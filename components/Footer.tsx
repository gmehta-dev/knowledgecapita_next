"use client";

import { useState } from "react"
import { Button, Col, Container, Modal, Row } from "react-bootstrap"

const footerData: any = {
    disclaimer: {
        title: 'Disclaimer',
        content: 'The leaders listed here on this website have no agreement or relationship whatsoever with the Knowledge Capita. Only professional background information of these leaders is listed here- information most of which is already available in public domain.'

    },
    termCondition: {
        title: 'Term & condition',
        content: '------'
    }
}
export default function Footer() {
    const [modalOpen, setModalOpen] = useState<string>()
    return (
        <footer className="footer py-3 bg-primary">
            <Container fluid={true}>
                <Row className="align-items-center">
                    <Col xs={12} md="auto" className="text-center text-md-start mb-2 mb-md-0">
                        <span className="text-white small">© {new Date().getFullYear()} KNOWLEDGE CAPITA. All rights reserved.</span>
                    </Col>
                    <Col xs={12} md="auto" className="text-center text-md-end ms-md-auto">
                        <Button size="sm" variant="link" className="text-white text-decoration-none p-0" onClick={() => setModalOpen('disclaimer')}>Disclaimer</Button>
                    </Col>
                </Row>
            </Container>
            <Modal show={modalOpen ? true : false} size="lg" onHide={() => setModalOpen(undefined!)}>
                <Modal.Header closeButton>
                    <Modal.Title>{footerData[modalOpen!]?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {footerData[modalOpen!]?.content}
                </Modal.Body>
                <Modal.Footer>

                </Modal.Footer>
            </Modal>
        </footer>
    )
}