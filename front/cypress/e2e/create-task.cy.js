describe('E2E - Crear tarea', () => {
  it('crea una tarea desde la interfaz y la muestra en el listado', () => {
    const timestamp = Date.now();
    const title = `E2E crear ${timestamp}`;
    const description = `Descripcion E2E ${timestamp}`;

    cy.visit('/');
    cy.get('input[aria-label="task-title"]').type(title);
    cy.get('textarea[aria-label="task-description"]').type(description);
    cy.contains('button', 'Agregar tarea').click();

    cy.contains('.task-item', title).should('be.visible');
    cy.contains('.task-item', description).should('be.visible');
  });
});

