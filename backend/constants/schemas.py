receipt_schema = {
    "name": "receipt_details",  # ← a unique name for your schema
    "schema": {
        "type": "object",
        "properties": {
            "merchant_name": {"type": "string", "nullable": True},
            "merchant_address": {"type": "string", "nullable": True},
            "merchant_phone": {"type": "string", "nullable": True},
            "merchant_email": {"type": "string", "nullable": True},
            "transaction_date": {"type": "string", "format": "date", "nullable": True},
            "subtotal_amount": {"type": "number", "nullable": True},
            "tax_amount": {"type": "number", "nullable": True},
            "total_amount": {"type": "number", "nullable": True},
            "payment_method": {"type": "string", "nullable": True},
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "description": {"type": "string"},
                        "unit_price": {"type": "number", "nullable": True},
                        "quantity": {"type": "number", "nullable": True},
                    },
                },
            },
        },
        "required": [],  # you can list required keys if you want
    },
}

category_schema = {
    "name": "expense_category",
    "schema": {
        "type": "object",
        "properties": {"expense_category": {"type": "string"}},
        "required": ["expense_category"],
    },
}

expense_categories = [
    {
        "category": "Groceries",
        "description": "Supermarkets, grocery stores, food markets",
    },
    {
        "category": "Dining",
        "description": "Restaurants, cafes, fast food, food delivery",
    },
    {
        "category": "Transportation",
        "description": "Gas stations, parking, ride-sharing, public transit",
    },
    {
        "category": "Utilities",
        "description": "Electric, water, gas, internet, phone bills",
    },
    {
        "category": "Entertainment",
        "description": "Movies, concerts, streaming, games, books",
    },
    {
        "category": "Travel",
        "description": "Hotels, flights, car rentals, vacation expenses",
    },
    {
        "category": "Health & Wellness",
        "description": "Pharmacy, medical, fitness, beauty",
    },
    {
        "category": "Office Supplies",
        "description": "Stationery, computer supplies, business materials",
    },
    {
        "category": "Shopping",
        "description": "Clothing, electronics, home goods, general retail",
    },
    {
        "category": "Services",
        "description": "Professional services, repairs, maintenance",
    },
    {
        "category": "Other",
        "description": "Everything else not fitting above categories",
    },
]
