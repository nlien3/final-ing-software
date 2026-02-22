describe('E2E - Actualizar tarea', () => {
  it('actualiza titulo y descripcion de una tarea existente', () => {
    const timestamp = Date.now();
    const initialTitle = `E2E editar inicial ${timestamp}`;
    const updatedTitle = `E2E editar final ${timestamp}`;
    const updatedDescription = `Descripcion actualizada ${timestamp}`;
    const apiUrl = Cypress.env('apiUrl');

    cy.request('POST', `${apiUrl}/tasks`, {
      title: initialTitle,
      description: 'Descripcion inicial'
    });

    cy.visit('/');
    cy.contains('.task-item', initialTitle)
      .should('be.visible')
      .within(() => {
        cy.get('button[aria-label="Editar tarea"]').click();
      });

    cy.get('input[aria-label="modal-edit-title"]').clear().type(updatedTitle);
    cy.get('textarea[aria-label="modal-edit-description"]').clear().type(updatedDescription);
    cy.contains('button', 'Guardar cambios').click();

    cy.contains('.task-item', updatedTitle).should('be.visible');
    cy.contains('.task-item', updatedDescription).should('be.visible');
  });
});

