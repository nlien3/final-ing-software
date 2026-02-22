describe('E2E - Manejo de errores front-back', () => {
  it('muestra error cuando backend rechaza payload invalido', () => {
    const title = `E2E error ${Date.now()}`;
    const tooLongDescription = 'x'.repeat(1001);

    cy.visit('/');
    cy.get('input[aria-label="task-title"]').type(title);
    cy.get('textarea[aria-label="task-description"]').type(tooLongDescription, { delay: 0 });
    cy.contains('button', 'Agregar tarea').click();

    cy.contains('.error', 'description must be <= 1000 chars').should('be.visible');
  });
});

