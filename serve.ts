import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', () => Bun.file('./dist/home/index.html'))
    .get('/about', () => Bun.file('./dist/about/index.html'))
    .get('/*', ({ path }) => {
        const file = Bun.file(`./dist${path}`)
        return file.exists().then(exists => exists ? file : new Response("Not Found", { status: 404 }))
    })
    .listen(3000)

console.log(`🚀 Server jalan di http://localhost:3000`)