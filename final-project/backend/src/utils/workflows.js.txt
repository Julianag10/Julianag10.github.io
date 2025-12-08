// When the Stripe webhook fires and a donation is saved:

// evaluateWorkflows(donation)

// This function:

    // Fetches all workflows from DB

    // Checks if the trigger matches

    // Checks conditions

    // Runs each action:

    // immediate email

    // schedule future jobs

    // Logs workflow execution
// This is  BACKGROUND LOGIC, not an API endpoint.