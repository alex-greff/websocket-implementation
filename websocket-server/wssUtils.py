def s2bs(s: str) -> str:
  """
  Returns a bit string representing the given utf-8 string
  """
  return bin(int(s.encode().hex(), 16))[2:]

def bs2s(s: str) -> str:
  """
  Returns the utf-8 string that the given bit string represents
  """
  return int(s, 2).to_bytes(len(s)//8 + 1, 'little').decode('utf-8')

def b2bs(b: bytes) -> str:
  """
  Returns a bit string representing the given byte sequence
  """
  return bin(int(b.hex(), 16))[2:]

def bs2b(s:str) -> bytes:
  """
  Returns the byte sequence representation of the given bit string
  """
  return int(s, 2).to_bytes(len(s)//8 + 1, 'little')