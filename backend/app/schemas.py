from typing import Literal,Optional
from pydantic import BaseModel,Field
class SessionCreate(BaseModel): consent:bool=True
class DecisionCreate(BaseModel):
 scenario_id:str
 action:Literal["accept","reject","verify"]
 selected_option_id:Optional[str]=Field(default=None,max_length=80)
