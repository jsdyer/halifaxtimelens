from urllib.parse import urlsplit
from source import records, save

def main():
    fields = 'IMAGEID,IMAGENM,IMAGEYR,URL,LAT,LONG_'
    rows = records('Historical_Aerial_Photographs_Index/FeatureServer/0','1=1',fields)
    photos = []
    for r in rows:
        u = urlsplit(r['URL'])
        if (r['URL'] and (u.scheme != 'https' or u.hostname != 'archive.halifax.ca')) or not (40<r['LAT']<50 and -70<r['LONG_']<-55):
            raise ValueError('Unexpected archive link or index location')
        photos.append([r['IMAGEID'],r['IMAGENM'],int(r['IMAGEYR']),r['LAT'],r['LONG_'],r['URL']])
    if len(photos) < 300 or len({p[0] for p in photos}) != len(photos):
        raise ValueError('Incomplete municipal photo index')
    save('photos.json',count=len(photos),photos=sorted(photos))
if __name__=='__main__': main()
