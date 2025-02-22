export const commonMiddleware = {
    logger() {
        return async (context, next) => {
            const start = Date.now();
            await next();
            const duration = Date.now() - start;
            console.log(`${context.operation} ${context.key} (${duration}ms)`);
        };
    },
    validate(validator) {
        return async (context, next) => {
            if (context.operation === 'set' && !validator(context.value)) {
                throw new Error('Validation failed');
            }
            await next();
        };
    },
    stats() {
        const stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
        return async (context, next) => {
            await next();
            switch (context.operation) {
                case 'get':
                    context.value ? stats.hits++ : stats.misses++;
                    break;
                case 'set':
                    stats.sets++;
                    break;
                case 'delete':
                    stats.deletes++;
                    break;
            }
        };
    }
};
