---
title: Contact
menu: Contact
eyebrow: Contact
subtitle: "Studio, palco, post: raccontami il progetto e ti rispondo entro 24 ore lavorative."
facts:
  - { label: 'Email',         value: '<a href="mailto:niccolomenegazzoaudio@gmail.com">niccolomenegazzoaudio@gmail.com</a>' }
  - { label: 'Telefono',      value: '+39 000 000 0000' }
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
