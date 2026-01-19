# SafariDesk

Open-source helpdesk and ticketing system.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/SafariDesk-OS/safaridesk.git
cd safaridesk

# Copy environment template
cp .env.example .env

# Edit .env with your values
# See docs for configuration details

# Start all services
docker compose up -d
```

**Default admin login:** Check your `.env` values for `SUPERUSER_*` credentials.

## Documentation

Full documentation: [docs.safaridesk.io](https://docs.safaridesk.io/docs)

- [Installation](https://docs.safaridesk.io/docs/installation)
- [Configuration](https://docs.safaridesk.io/docs/configuration)
- [Features](https://docs.safaridesk.io/docs/features)

## Stack

- **Backend:** Django, Celery, PostgreSQL, Redis
- **Frontend:** React, TypeScript, Vite
- **AI:** Google Gemini (optional)

## License

AGPL-3.0 - See [LICENSE](LICENSE)
