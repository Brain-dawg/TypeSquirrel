// Test file for keyvalue syntax highlighting

// String keyvalues (should be highlighted with entity.name.keyvalue.string.squirrel)
targetname = "my_entity"
classname = "func_button" 
sound = "buttons/button01.wav"
model = "models/props/button.mdl"
Material = "metal/metalwall001"

health = 100
damage = 50
speed = 300
delay = 2.5
Radius = 128
TeamNum = 2

// Vector keyvalues (should be highlighted with entity.name.keyvalue.vector.squirrel)
origin = Vector(0, 0, 0)
angles = Vector(0, 90, 0)
rendercolor = Vector(255, 255, 255)
velocity = Vector(100, 0, 50)
mins = Vector(-16, -16, -16)
maxs = Vector(16, 16, 16)

// Type-checking keywords (should be highlighted with entity.name.keyvalue.type.squirrel - dark green)
null
table
array
func
string
blob
integer
float
entity
class
instance
bool

// Regular variables (should use default highlighting)
local myVar = "test"
local myNumber = 42
local myVector = Vector(1, 2, 3)
