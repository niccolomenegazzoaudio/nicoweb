---
title: Scrivimi
menu: Contatti
subtitle: "Studio, palco, post: raccontami il progetto e ti rispondo entro 24 ore lavorative."
facts:
  - { label: 'Email',         value: '<span class="email-link" data-u="niccolomenegazzoaudio" data-d="gmail.com">scrivimi via email</span>' }
  - { label: 'WhatsApp',      value: '<a href="https://wa.me/393664551806" target="_blank" rel="noopener">+39 366 455 1806 <span class="ext-arrow">↗</span></a>' }
  - { label: 'Base',          value: 'Italia' }
  - { label: 'Risposta',      value: 'Entro 24h lavorative' }
form:
  name: contact
  fields:
    - name: name
      label: Nome
      type: text
      validate:
        required: true
    - name: email
      label: Email
      type: email
      validate:
        required: true
    - name: subject
      label: Oggetto
      type: text
    - name: message
      label: Messaggio
      type: textarea
      validate:
        required: true
        min: 10
    - name: g-recaptcha-response
      label: Captcha
      type: honeypot
  buttons:
    - type: submit
      value: Invia messaggio
  process:
    - email:
        from: '{{ config.plugins.email.from }}'
        to: '{{ config.plugins.email.from }}'
        reply_to: '{{ form.value.email }}'
        subject: '[Portfolio] {{ form.value.subject|default("Nuovo messaggio") }} — {{ form.value.name }}'
        body: "{% include 'forms/data.html.twig' %}"
    - save:
        fileprefix: contact-
        dateformat: Ymd-His-u
        extension: txt
        body: "{% include 'forms/data.txt.twig' %}"
    - message: 'Grazie! Il messaggio è stato inviato. Ti rispondo prestissimo.'
    - display: thankyou
---
Per progetti urgenti scrivi direttamente in oggetto **URGENTE**: ricevo notifica push.
