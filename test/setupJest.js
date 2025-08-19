// Jest setup after environment
beforeAll(async () => {
    // Give time for services to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
});

afterAll(async () => {
    // Clean up any resources if needed
    await new Promise(resolve => setTimeout(resolve, 100));
});
