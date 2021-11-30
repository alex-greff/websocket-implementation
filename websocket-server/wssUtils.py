def s2bs(s: str) -> str:
  """
  String -> BitString
  Returns a bit string representing the given utf-8 string
  """
  return bin(int(s.encode().hex(), 16))[2:]

def bs2s(s: str, endian='big') -> str:
  """
  BitString -> String (utf-8)
  Returns the utf-8 string that the given bit string represents
  """
  return int(s, 2).to_bytes(len(s)//8 + 1, 'endian').decode('utf-8')

def b2bs(b: bytes) -> str:
  """
  Bytes -> BitString
  Returns a bit string representing the given byte sequence
  """
  return bin(int(b.hex(), 16))[2:]

def bs2b(s:str, endian='big') -> bytes:
  """
  BitString -> Bytes
  Returns the bytes representation of the given bit string
  """
  if len(s) == 0:
    print(s)
    return b''
  try:
    res = int(s, 2).to_bytes(max(len(s)//8, 1), endian)
  except:
    res = int(s, 2).to_bytes(max(len(s)//8+1, 1), endian)
  return res