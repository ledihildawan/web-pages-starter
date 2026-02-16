import { defineUnlighthouseConfig } from 'unlighthouse/config'

export default defineUnlighthouseConfig({
    site: 'http://localhost:5000/home',
    ci: {
        buildStatic: true,
    }
})
