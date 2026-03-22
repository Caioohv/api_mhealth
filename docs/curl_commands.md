# Auth Verification Commands

## Registro de Usuário
# Register a new user
curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User",
       "phone": "123456789"
     }'

## Login de Usuário
# Login with the created user
curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'

## Acesso a Rota Privada (Dashboard)
# Access dashboard with JWT (replace <TOKEN> with the accessToken from login)
curl -X GET http://localhost:3000/api/dashboard \
     -H "Authorization: Bearer <TOKEN>"

## Acesso a Rota Privada (Lista de Usuários)
# Access users list with JWT (replace <TOKEN> with the accessToken from login)
curl -X GET http://localhost:3000/api/users \
     -H "Authorization: Bearer <TOKEN>"

## Login via Google (Mock/Exemplo)
# Login/Register via Google OAuth (requires a valid Google idToken)
curl -X POST http://localhost:3000/auth/google \
     -H "Content-Type: application/json" \
     -d '{
       "idToken": "<GOOGLE_ID_TOKEN>"
     }'
