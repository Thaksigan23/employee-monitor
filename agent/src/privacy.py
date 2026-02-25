PRIVATE_KEYWORDS = ["bank", "whatsapp", "login", "password", "pay", "email"]

def mask_if_private(title: str):
    lower = title.lower()
    for word in PRIVATE_KEYWORDS:
        if word in lower:
            return "Private Activity", True
    return title, False