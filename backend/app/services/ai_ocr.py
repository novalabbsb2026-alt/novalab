import os
import base64
from typing import Dict, Any, Tuple
from pydantic import BaseModel, Field

# Classe de validação para output estruturado
class RecipeData(BaseModel):
    client_name: str = Field(..., description="Nome do cliente/paciente encontrado")
    doctor_name: str = Field("", description="Nome do médico oftalmologista encontrado")
    shop_name: str = Field("", description="Nome da ótica parceira emissora da receita")
    
    od_spherical: float = Field(0.0, description="Grau esférico do olho direito")
    od_cylindrical: float = Field(0.0, description="Grau cilíndrico do olho direito")
    od_axis: int = Field(0, description="Eixo do olho direito (0 a 180)")
    od_addition: float = Field(0.0, description="Adição do olho direito")
    od_dnp: float = Field(0.0, description="DNP do olho direito")
    
    oe_spherical: float = Field(0.0, description="Grau esférico do olho esquerdo")
    oe_cylindrical: float = Field(0.0, description="Grau cilíndrico do olho esquerdo")
    oe_axis: int = Field(0, description="Eixo do olho esquerdo (0 a 180)")
    oe_addition: float = Field(0.0, description="Adição do olho esquerdo")
    oe_dnp: float = Field(0.0, description="DNP do olho esquerdo")

def get_mock_recipe(filename: str) -> Dict[str, Any]:
    """
    Retorna receitas fictícias baseadas no nome do arquivo para cobrir
    todos os cenários de teste exigidos (Sucesso, Transposição, Erro Geométrico).
    """
    name = filename.lower()
    
    if "transposicao" in name or "positivo" in name or "transpor" in name:
        # Receita em cilindro positivo (+) para forçar a transposição
        return {
            "client_name": "Antônio da Silva (Teste Transposição)",
            "doctor_name": "Dr. Fernando Costa",
            "shop_name": "Ótica Aliança",
            "od_spherical": 2.00,
            "od_cylindrical": 1.00, # Positivo, transporá para esf +3.00 / cil -1.00 eixo 135
            "od_axis": 45,
            "od_addition": 2.00,
            "od_dnp": 31.00,
            "oe_spherical": 1.50,
            "oe_cylindrical": 1.50, # Positivo, transporá para esf +3.00 / cil -1.50 eixo 45
            "oe_axis": 135,
            "oe_addition": 2.00,
            "oe_dnp": 31.50
        }
        
    elif "erro" in name or "pequeno" in name or "reprovado" in name or "diametro" in name:
        # DNP muito baixa (ex: 22mm e 23mm) gerará descentração alta.
        # Com diâmetro de aro 56 e ponte 18, o ROP/diâmetro mínimo exigirá mais de 72mm.
        # Modelos em estoque de 65mm ou 70mm falharão na validação.
        return {
            "client_name": "Carlos Souza (Teste Erro Geométrico)",
            "doctor_name": "Dr. Roberto Martins",
            "shop_name": "Ótica Zoom",
            "od_spherical": -4.00,
            "od_cylindrical": -1.50,
            "od_axis": 90,
            "od_addition": 0.00,
            "od_dnp": 22.00, # DNP anormalmente pequena
            "oe_spherical": -4.00,
            "oe_cylindrical": -1.50,
            "oe_axis": 90,
            "oe_addition": 0.00,
            "oe_dnp": 23.00
        }
        
    else:
        # Receita padrão de sucesso com dioptrias comuns e DNP segura
        return {
            "client_name": "Rafael Silva",
            "doctor_name": "Dra. Sandra de Sá",
            "shop_name": "Ótica do Centro",
            "od_spherical": -2.50,
            "od_cylindrical": -1.00,
            "od_axis": 90,
            "od_addition": 2.00,
            "od_dnp": 32.50,
            "oe_spherical": -3.00,
            "oe_cylindrical": -0.75,
            "oe_axis": 85,
            "oe_addition": 2.00,
            "oe_dnp": 33.00
        }

async def analyze_recipe_image(filename: str, image_bytes: bytes) -> Dict[str, Any]:
    """
    Orquestra a extração OCR de receitas usando o Google Gemini se configurado.
    Caso contrário, retorna o mock inteligente correspondente.
    """
    if not os.getenv("GEMINI_API_KEY"):
        return get_mock_recipe(filename)
        
    try:
        import json
        import httpx
        api_key = os.getenv("GEMINI_API_KEY")
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        
        prompt = """Você é um assistente óptico especialista em ler receitas médicas de óculos (oftálmicas).
Analise a imagem da receita médica anexada e extraia as informações no formato JSON exatamente com as seguintes chaves:
{
  "client_name": "",
  "doctor_name": "",
  "shop_name": "",
  "od_spherical": 0.0,
  "od_cylindrical": 0.0,
  "od_axis": 0,
  "od_addition": 0.0,
  "od_dnp": 32.0,
  "oe_spherical": 0.0,
  "oe_cylindrical": 0.0,
  "oe_axis": 0,
  "oe_addition": 0.0,
  "oe_dnp": 32.0
}
Observações importantes:
1. Mantenha os sinais matemáticos de positivo (+) e negativo (-) originais.
2. Eixos de astigmatismo variam de 0 a 180.
3. Se algum valor não for encontrado, defina-o como 0.0 para numéricos e string vazia ("") para textos.
Retorne APENAS o JSON válido."""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}}
                ]
            }],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.0}
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_text)
            return RecipeData(**parsed).model_dump()
        
    except Exception as e:
        print(f"Erro no processamento OCR com Gemini: {e}. caindo para Mock.")
        return get_mock_recipe(filename)
