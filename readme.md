3 routes : 
    - POST /register
    - POST /login
    - GET /verify (internal)

- /register
Pass in "name","email","password".
A mail with verification link will be sent to your email address. Click that link to verify your account and then fire up the login request to test login route

- /login
Pass in "email","password"