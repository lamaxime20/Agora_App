import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Image from 'react-bootstrap/Image';
import logo from '../assets/Agora2.jpg';
import axios from 'axios';

const Connexion = () => {
  const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post("http://localhost:8000/api/login", {
        email,
        password
      });
      const { user, token } = response.data;
      console.log('User reçu:', user);

      // Stocker le token dans localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Gérer la fonctionnalité "se souvenir de moi"
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Rediriger en fonction du rôle
      if (user.role === 'Manager') {
        navigate('/manager/dashboard');

      } else if (user.role === 'Commercial') {
        console.log('Redirection vers /commercial/dashboard');
        navigate('/commercial/dashboard');
      }
    } catch (err) {
      setError('Email ou mot de passe incorrect.');
      console.error('Erreur de connexion:', err);
    }
  };

  return (
    <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f0f3f7' }}>
      <Card style={{ width: '30rem', boxShadow: '8px 8px 7px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body>
          <div className='text-center mb-4'>
            <Image src={logo} style={{ width: '200px' }} />
          </div>
          <div className='text-center mb-4'>
            <Card.Title>Hello, Bienvenue</Card.Title>
            <Card.Text>Veuillez entrer vos identifiants pour continuer</Card.Text>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Floating className="mb-3">
              <Form.Control
                id="floatingInputCustom"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
              <label htmlFor="floatingInputCustom">Adresse email</label>
            </Form.Floating>

            <Form.Floating className="mb-3">
              <Form.Control
                id="floatingPasswordCustom"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe"
                required
              />
              <label htmlFor="floatingPasswordCustom">Mot de passe</label>
            </Form.Floating>

            <div className="d-flex justify-content-between mb-3">
              <Form.Check
                type="checkbox"
                label="Se souvenir de moi"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
            </div>

            <Button variant="warning" type="submit" className="w-100 mb-3 mt-4" style={{ backgroundColor: '#ff9900', color: '#ffffff' }}>
              <h5>Connexion</h5>
            </Button>

            <p className="text-muted">
              Vous n'avez pas de compte ? <Link to="/register">Inscrivez-vous</Link>
            </p>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Connexion;