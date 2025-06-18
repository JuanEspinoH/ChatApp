export async function createApp(httpServer, config) {
  const prisma = new PrismaClient()
  // logger.info('applying migration scripts...')
  // const migrations = await migrate({ client: pgPool }, 'sql')
  // logger.info('%d migration scripts were applied', migrations.length)

  if (config.cors) {
    app.use(cors(config.cors))
  }

  const io = new Server(httpServer, {
    cors: config.cors,
  })

  // const db = new DB(pgPool)

  //   initAuth({ app, io, db, config })
  //   initEventHandlers({ io, db, config })

  //   const timerId = scheduleZombieUsersCleanup({ io, db })

  return {
    // logger,
    // pgPool,
    async close() {
      io.close()
      console.log('se cerro el servidor')

      // clearInterval(timerId)
    },
  }
}
